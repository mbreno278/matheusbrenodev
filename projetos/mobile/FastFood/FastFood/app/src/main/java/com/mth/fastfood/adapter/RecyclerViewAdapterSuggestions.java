package com.mth.fastfood.adapter;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.RecyclerView;
import com.mth.fastfood.R;
import com.mth.fastfood.adapter.RecyclerViewAdapterSuggestions;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.SearchSuggestions;
import java.util.ArrayList;

public class RecyclerViewAdapterSuggestions extends RecyclerView.Adapter<RecyclerViewAdapterSuggestions.ViewHolder> {
    
    private Context mContext;
    private ArrayList<SearchSuggestions> array_list = new ArrayList<SearchSuggestions>();
    
    private OnItemClickListener mOnItemClickListener;
    
    public RecyclerViewAdapterSuggestions(Context ctx, ArrayList<SearchSuggestions> array) {
        this.mContext = ctx;
        this.array_list = array;
    }
    
    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        
        View view = LayoutInflater.from(mContext).inflate(R.layout.search_suggestions_item, parent, false);
        ViewHolder holder = new ViewHolder(view);
        
        return holder;
    }
    
    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        holder.name.setText(array_list.get(position).getName());
        
        ImageView icon = holder.icon;
        
        if (array_list.get(position).getType().equals(SearchSuggestions.TYPE_HISTORIC)) {
            icon.setImageResource(R.drawable.ic_historic);
        }else if (array_list.get(position).getType().equals(SearchSuggestions.TYPE_SUGGESTIONS)) {
            icon.setImageResource(R.drawable.ic_search);
        }
        
    }
    
    @Override
    public int getItemCount() {
        return array_list.size();
    }
    
    public void setOnItemClickListener(OnItemClickListener listener) {
        this.mOnItemClickListener = listener;
    }
    
    public class ViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        
        private ImageView icon;
        private TextView name;
        
        public ViewHolder(View view) {
            super(view);
            
            icon = (ImageView) view.findViewById(R.id.icon);
            name = (TextView) view.findViewById(R.id.name);
            
            view.setOnClickListener(this);
        }
        
        @Override
        public void onClick(View v) {
            int position = getAdapterPosition();
            mOnItemClickListener.onClick(position);
        }
        
    }
    
}
