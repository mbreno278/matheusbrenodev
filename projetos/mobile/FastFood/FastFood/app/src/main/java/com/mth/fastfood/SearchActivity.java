package com.mth.fastfood;

import android.animation.ObjectAnimator;
import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ImageButton;
import androidx.annotation.MainThread;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.appbar.AppBarLayout;
import com.google.android.material.appbar.MaterialToolbar;
import com.mth.fastfood.adapter.RecyclerViewAdapterSuggestions;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.SearchSuggestions;
import java.util.ArrayList;

public class SearchActivity extends AppCompatActivity {

    private EditText mSearch;
    private ImageButton mBtnClear;

    private RecyclerView mRecycler;
    private RecyclerViewAdapterSuggestions mAdapter;
    private LinearLayoutManager llm;
    private ArrayList<SearchSuggestions> array_list = new ArrayList<SearchSuggestions>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search);

        main();
        logic();
    }

    public void main() {
        mSearch = (EditText) findViewById(R.id.search);
        mBtnClear = (ImageButton) findViewById(R.id.btn_clear);
        mRecycler = (RecyclerView) findViewById(R.id.recycler_view);
        llm = new LinearLayoutManager(this);
    }

    public void logic() {

        mSearch.requestFocus();
        InputMethodManager imm =
                (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.showSoftInput(mSearch, 0);
        
        mBtnClear.setOnClickListener(
            new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    mSearch.setText("");
                }
            }
        );
        
        mRecycler.setHasFixedSize(true);
        mRecycler.setLayoutManager(llm);
        
        String[] hist = {
            "Hamburgue",
            "Hamburgue x-tudo",
            "Pizza pequena",
            "Refrigerante de laranja"
        };

        for (int i = 0; hist.length > i; i++) {
            SearchSuggestions item = new SearchSuggestions();
            item.setID(i);
            item.setName(hist[i]);
            item.setType(SearchSuggestions.TYPE_HISTORIC);

            array_list.add(item);
        }

        String[] items = {
            "Hambúrgue",
            "Pizza média",
            "Pizza grande",
            "Refrigerante de carrafa"
        };

        for (int i = 0; items.length > i; i++) {
            SearchSuggestions item = new SearchSuggestions();
            item.setID(i);
            item.setName(items[i]);
            item.setType(SearchSuggestions.TYPE_SUGGESTIONS);

            array_list.add(item);
        }

        mAdapter = new RecyclerViewAdapterSuggestions(this, array_list);
        mRecycler.setAdapter(mAdapter);
        
        mAdapter.setOnItemClickListener(
            new OnItemClickListener() {
                @Override
                public void onClick(int position) {
                    mSearch.setText(array_list.get(position).getName());
                }
            }
        );
        
    }

    @Override
    @MainThread
    public void onBackPressed() {
        super.onBackPressed();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }
}
