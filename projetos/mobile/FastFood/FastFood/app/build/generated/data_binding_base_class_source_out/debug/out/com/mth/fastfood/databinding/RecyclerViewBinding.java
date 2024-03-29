// Generated by view binder compiler. Do not edit!
package com.mth.fastfood.databinding;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewbinding.ViewBinding;
import com.mth.fastfood.R;
import java.lang.NullPointerException;
import java.lang.Override;

public final class RecyclerViewBinding implements ViewBinding {
  @NonNull
  private final RecyclerView rootView;

  @NonNull
  public final RecyclerView recyclerView;

  private RecyclerViewBinding(@NonNull RecyclerView rootView, @NonNull RecyclerView recyclerView) {
    this.rootView = rootView;
    this.recyclerView = recyclerView;
  }

  @Override
  @NonNull
  public RecyclerView getRoot() {
    return rootView;
  }

  @NonNull
  public static RecyclerViewBinding inflate(@NonNull LayoutInflater inflater) {
    return inflate(inflater, null, false);
  }

  @NonNull
  public static RecyclerViewBinding inflate(@NonNull LayoutInflater inflater,
      @Nullable ViewGroup parent, boolean attachToParent) {
    View root = inflater.inflate(R.layout.recycler_view, parent, false);
    if (attachToParent) {
      parent.addView(root);
    }
    return bind(root);
  }

  @NonNull
  public static RecyclerViewBinding bind(@NonNull View rootView) {
    if (rootView == null) {
      throw new NullPointerException("rootView");
    }

    RecyclerView recyclerView = (RecyclerView) rootView;

    return new RecyclerViewBinding((RecyclerView) rootView, recyclerView);
  }
}
